import React from 'react';
import { Link } from 'react-router-dom';

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

export default function LinkifiedText({ text, className }: LinkifiedTextProps) {
  if (!text) return null;

  // Regex to match URLs: http:// or https:// followed by non-whitespace characters
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  // Regex to match Mentions: @ followed by alphanumeric characters, underscores, or hyphens
  const mentionRegex = /(@[a-zA-Z0-9_-]+)/g;
  // Regex to match Hashtags: # followed by alphanumeric characters, underscores, or hyphens
  const hashtagRegex = /(#[a-zA-Z0-9_-]+)/g;

  // Split the text by URLs, Mentions and Hashtags
  const parts = text.split(/((?:https?:\/\/[^\s]+)|(?:@[a-zA-Z0-9_-]+)|(?:#[a-zA-Z0-9_-]+))/g);

  return (
    <span className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        if (part.match(mentionRegex)) {
          const username = part.slice(1);
          return (
            <Link
              key={i}
              to={`/profile/${username}`}
              className="text-purple-500 font-bold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        if (part.match(hashtagRegex)) {
          const tag = part.slice(1);
          return (
            <Link
              key={i}
              to={`/search?q=%23${tag}`}
              className="text-blue-400 font-bold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        return part;
      })}
    </span>
  );
}
