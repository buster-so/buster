import { useEffect } from 'react';
import isFunction from 'lodash/isFunction';

/**
 * A custom hook that calls a provided callback function when the window gains focus.
 *
 * @param {Function} callback - The function to be called when the window gains focus.
 */
export const useWindowFocus = (callback: () => void, offFocusCallback?: () => void) => {
  useEffect(() => {
    if (!isFunction(callback)) {
      return;
    }

    const handleFocus = () => {
      callback();
    };

    const handleBlur = () => {
      if (offFocusCallback) {
        offFocusCallback();
      }
    };

    // Add event listener for window focus
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [callback]); // Dependency array ensures the effect runs again if the callback changes
};

export default useWindowFocus;
