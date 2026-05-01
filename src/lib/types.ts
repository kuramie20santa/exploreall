export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  home_country: string | null;
  travel_history: string[] | null;
  is_private: boolean;
  notify_email: boolean;
  notify_comments: boolean;
  notify_likes: boolean;
  created_at: string;
};

export type Country = {
  code: string;
  name: string;
  capital: string | null;
  continent: string | null;
  flag_emoji: string | null;
  best_time_to_visit: string | null;
  travel_summary: string | null;
  common_tips: string[] | null;
  common_scams: string[] | null;
  visa_notes: string | null;
};

export type SafetyRating = {
  country_code: string;
  score: number;
  level: "safe" | "mostly_safe" | "caution" | "high_risk" | "do_not_travel";
  summary: string | null;
};

export type Post = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  country_code: string | null;
  city: string | null;
  trip_start: string | null;
  trip_end: string | null;
  tags: string[] | null;
  like_count: number;
  comment_count: number;
  created_at: string;
};

export type PostWithMeta = Post & {
  author: Pick<Profile, "username" | "full_name" | "avatar_url">;
  images: { url: string }[];
  liked?: boolean;
  saved?: boolean;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author?: Pick<Profile, "username" | "full_name" | "avatar_url">;
};
