import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Supabase Service Role Client (Bypasses RLS)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: any = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
}

const ADMIN_PASSWORD = 'RealMaveboAdminModeration67';

// Middleware to check admin password
const checkAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['x-admin-password'];
  if (authHeader === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized admin access' });
  }
};

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.delete("/api/admin/photo/:id", checkAdminAuth, async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase Service Role Key not configured' });
  }
  const { id } = req.params;
  const { error } = await supabaseAdmin.from('photos').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/admin/post/:id", checkAdminAuth, async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase Service Role Key not configured' });
  }
  const { id } = req.params;
  const { error } = await supabaseAdmin.from('posts').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/admin/user/:id", checkAdminAuth, async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase Service Role Key not configured' });
  }
  const { id } = req.params;
  // Note: deleting a user profile. In a real app we might want to delete from auth.users too,
  // but that requires more complex setup and maybe we just want to clear the profile/content.
  const { error } = await supabaseAdmin.from('profiles').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
