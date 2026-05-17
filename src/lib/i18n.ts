import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      navigation: {
        feed: 'Feed',
        search: 'Search',
        add: 'Add',
        gallery: 'Gallery',
        profile: 'Profile',
        settings: 'Settings'
      },
      feed: {
        experience: 'Feed',
        circle: 'Following',
        global: 'Explore',
        empty_following: 'Your feed is empty',
        empty_following_sub: 'Follow people to see their photos.',
        explore_globally: 'Explore Photos'
      },
      search: {
        placeholder: 'Search StartOrigin discovery...',
        honor_board: 'Honor Board',
        honor_board_sub: 'The pioneers and friends of StartOrigin',
        awaiting: 'Awaiting discovery',
        no_matches: 'No matches found',
        users_tab: 'Users'
      },
      settings: {
        title: 'Settings',
        subtitle: 'Profile & Preferences',
        shop: 'Shop',
        leaderboard: 'Top Members',
        profile_section: 'Account Details',
        name_placeholder: 'Your Full Name',
        username_placeholder: 'Username',
        bio_placeholder: 'Write a few words about yourself...',
        appearance: 'Design & Style',
        gradient: 'Username Color',
        typography: 'Font Style',
        apply: 'Save Changes',
        languages: 'Language',
        logout: 'Log Out'
      },
      shop: {
        title: 'Shop',
        available: 'available',
        adopt: 'Get',
        tabs: {
          badges: 'Badges',
          pets: 'Pets',
          gradients: 'Colors',
          fonts: 'Fonts',
          styles: 'Styles'
        }
      },
      auth: {
        login: 'Login',
        signup: 'Sign Up',
        password: 'Password',
        show_password: 'Show password',
        hide_password: 'Hide password',
        email: 'Email',
        username: 'Username',
        name: 'Your Name',
        check_mail: 'Check your mail',
        check_mail_desc: "We've sent you a confirmation email. Confirm your mail and login to explore StartOrigin.",
        back_to_login: 'Back to Login'
      },
      gallery: {
        title: 'Your Gallery',
        collections_count: 'You have {{count}} collections',
        managing_albums: 'Managing {{count}} albums',
        organizing_photos: 'Organizing {{count}} photos',
        create_collection: 'Create Collection',
        unsorted: 'Unsorted',
        recents: 'Recents',
        photos_count: '{{count}} photos',
        no_collections: 'No collections found. Creativity awaits.',
        add_album: 'Add Album',
        edit_collection: 'Edit Collection',
        edit_album: 'Edit Album',
        new_album: 'New Album',
        save_changes: 'Save Changes',
        delete_confirm_title: 'Delete {{type}}?',
        delete_confirm_sub: 'Are you sure you want to delete "{{name}}"? This action is permanent.',
        yes_delete: 'Yes, delete it',
        no_keep: 'No, keep it',
        manage_photo: 'Manage Photo',
        move_save: 'Move & Save'
      },
      add: {
        title: 'Capture Discovery',
        subtitle: 'Share your vision with the world',
        drop_files: 'Drop your discoveries here',
        click_upload: 'or click to open portal',
        photo_name: 'Photo Name',
        collection: 'Collection',
        collection_placeholder: 'No Collection (Unsorted)',
        new_collection: 'New Collection',
        new_collection_placeholder: 'Name your new collection',
        album: 'Album',
        album_placeholder: 'Main Gallery',
        new_album: 'New Album',
        new_album_placeholder: 'Name your new album',
        privacy: 'Privacy',
        private: 'Private',
        public: 'Public',
        upload_button: 'Upload to Origin',
        uploading: 'Uploading...'
      },
      profile: {
        followers: 'Followers',
        following: 'Following',
        photos: 'Photos',
        swipes: 'Swipes',
        origins: 'Origins',
        settings: 'Settings',
        join_circle: 'Follow',
        in_circle: 'Following',
        tabs: {
          moments: 'Gallery',
          companions: 'Pets',
          saved: 'Saved'
        },
        empty_saved: 'You haven\'t saved any photos yet.',
        empty_photos: 'No photos uploaded yet.',
        manage_swipes: 'History',
        apply_essence: 'Change Style',
        companion: 'Pet',
        gift_pet: 'Gift Pet',
        sell_pet: 'Sell',
        confirm_sale: 'Confirm Sale',
        sell_for: 'Sell {{name}} for {{price}} Origins?',
        yes_sell: 'Yes, Sell Pet',
        gift_sent: 'Pet sent to their new owner!',
        search_hunters: 'Search all hunters...',
        people_in_circle: 'People in this circle',
        silence: 'Silence...',
        nothing_to_see: 'Nothing to see here yet',
        empty_followers_sub: '@{{username}} hasn\'t gathered a circle yet.'
      },
      landing: {
        title: "Welcome to StartOrigin.",
        subtitle: "Safe Photo Storage • Community • Collection",
        get_started: "Get Started",
        create_account: "Create Account",
        features_title: "Save Your Memories",
        features_sub: "Simple and powerful tools for your photography",
        tinder_title: "Swipe Photos 📸",
        tinder_sub: "Quickly browse through photography. Like what you love, save it to your collection.",
        ready: "Join us today",
        ready_sub: "Secure your high-quality photos and share them with the community.",
        footer: "Made for you",
        items: {
          badges: {
            verified: 'Verified',
            snowflake: 'Snowflake',
            computer: 'Computer',
            star: 'Star',
            crown: 'Crown',
            diamond: 'Diamond',
            heart: 'Heart',
            award: 'Award',
            rocket: 'Rocket',
            leaf: 'Leaf',
            moon: 'Moon',
            sun: 'Sun',
            music: 'Music',
            book: 'Book',
            coffee: 'Coffee',
            gamepad: 'Gamepad',
            gift: 'Gift',
            smile: 'Smile',
            sparkles: 'Sparkles',
            headphones: 'Headphones'
          },
          gradients: {
            soft_blue: 'Blue',
            sunset: 'Orange',
            emerald: 'Green',
            royal: 'Purple',
            neon: 'Pink'
          },
          fonts: {
            modern: 'Default',
            retro: 'Retro',
            futuristic: 'Sci-Fi',
            elegant: 'Elegant',
            handwritten: 'Handwritten',
            comic: 'Comic',
            cute: 'Cute',
            marker: 'Wild',
            sf_italic: 'Italic'
          },
          pets: {
            cat: 'Cat',
            dog: 'Dog',
            bat: 'Bat',
            owl: 'Owl'
          },
          themes: {
            default: 'White',
            black: 'Black',
            pink: 'Pink',
            gray: 'Gray',
            green: 'Green',
            blue: 'Blue',
            purple: 'Purple',
            orange: 'Orange',
            red: 'Red'
          },
          patterns: {
            none: 'Clear',
            circles: 'Circles',
            triangles: 'Triangles',
            squares: 'Squares',
            flowers: 'Flowers',
            hearts: 'Hearts',
            stars: 'Stars'
          }
        },
        features: {
          publish: "Share photos",
          publish_desc: "Upload and organize your best moments",
          follow: "Follow users",
          follow_desc: "Build your personal feed of photos",
          inspire: "Clean View",
          inspire_desc: "No ads or algorithms, just pure photography",
          swipe: "Quick Swipe",
          swipe_desc: "Browse through photos with simple gestures",
          decorations: "Customization",
          decorations_desc: "Change how your profile looks",
          badges: "Badges",
          badges_desc: "Earn unique badges for your profile",
          shop: "Origin Shop",
          shop_desc: "Use your origins to get cool items",
          gallery: "Portfolio",
          gallery_desc: "Show off your best photography"
        }
      },
      post: {
        ago: "ago",
        likes: "Likes",
        saved: "Saved",
        save: "Save Photo",
        share: "Share",
        captured_at: "Captured on",
        journey: "'s Photos",
        found: "Part of the"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
