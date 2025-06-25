// Global type declarations for static image imports
declare module '*.png' {
  const content: {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
  };
  export default content;
}

declare module '*.jpg' {
  const content: {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
  };
  export default content;
}

declare module '*.jpeg' {
  const content: {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
  };
  export default content;
}

declare module '*.gif' {
  const content: {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
  };
  export default content;
}

declare module '*.webp' {
  const content: {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
  };
  export default content;
}

declare module '*.svg' {
  const content: {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
  };
  export default content;
}

declare module '*.ico' {
  const content: {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
  };
  export default content;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      NEXT_PUBLIC_API_URL: string;
      NEXT_PUBLIC_API2_URL: string;
      NEXT_PUBLIC_WEB_SOCKET_URL: string;
      NEXT_PUBLIC_URL: string;
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      NEXT_PUBLIC_POSTHOG_KEY?: string;
      NEXT_PUBLIC_POSTHOG_HOST?: string;
      NEXT_PUBLIC_USER?: string;
      NEXT_PUBLIC_USER_PASSWORD?: string;

      //server only
      NEXT_SLACK_APP_SUPPORT_URL?: string;
    }
  }
}

export {};
