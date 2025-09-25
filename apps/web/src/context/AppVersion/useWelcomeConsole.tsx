import { useMount } from '@/hooks/useMount';
import { formatDate } from '@/lib/date';

export const useWelcomeConsole = () => {
  useMount(() => {
    console.log(
      `%c🚀 Welcome to Buster #${import.meta.env.VITE_BUILD_ID}`,
      'background: linear-gradient(to right, #a21caf, #8b1cb1, #6b21a8); color: white; font-size: 16px; font-weight: bold; padding: 10px; border-radius: 5px;'
    );
    console.log(
      `%c🐛 Found a bug? The code is open-source! Report it at https://github.com/buster-so/buster or send a PR! 🚀 • This version was deployed on ${formatDate({ date: import.meta.env.VITE_BUILD_AT, format: 'LLL' })}`,
      'background: #6b21a8; color: white !important; font-size: 10px; font-weight: 500; padding: 8px 12px; border-radius: 5px; text-decoration: none; --webkit-text-fill-color: white; --webkit-text-stroke-color: white;'
    );
  });
};
