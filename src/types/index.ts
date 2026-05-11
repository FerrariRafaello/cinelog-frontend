export interface User {
  id: number;
  name: string;
  age: number;
  email: string;
  cpf: string;
  bio?: string;
  pronouns?: string;
  favorite_genres?: string;
  avatar_id?: string;
  cover_id?: string;
}


export interface Genre {
  id: number;
  name: string;
}


export interface Movie {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  poster_path?: string;
  vote_average: number;
  genres?: Genre[];
  runtime?: number;
}


export interface Review{
    id:number;
    user_id:number;
    tmdb_movie_id:number;
    rating:number;
    comment?:string;
    created_at:string;
}


export interface WatchlistItem{
    id:number;
    user_id:number;
    tmdb_movie_id:number;
    status:"want_to_watch" | "watching" | "watched" | "dropped";
    created_at:string;
}


export interface AuthToken{
    access_token:string;
    token_type:string;
}