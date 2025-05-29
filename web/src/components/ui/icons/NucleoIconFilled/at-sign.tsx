import type { iconProps } from './iconProps';

function atSign(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px at sign';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,9.001c-1.654,0-3-1.346-3-3s1.346-3,3-3,3,1.346,3,3-1.346,3-3,3Zm0-4.5c-.827,0-1.5.673-1.5,1.5s.673,1.5,1.5,1.5,1.5-.673,1.5-1.5-.673-1.5-1.5-1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,12.001c-3.309,0-6-2.691-6-6S2.691.001,6,.001s6,2.691,6,6c0,1.738-1.024,3-2.435,3-1.158,0-2.065-.988-2.065-2.25v-3c0-.414.336-.75.75-.75s.75.336.75.75v3c0,.42.248.75.565.75.542,0,.935-.631.935-1.5,0-2.481-2.019-4.5-4.5-4.5S1.5,3.52,1.5,6.001s2.019,4.5,4.5,4.5c.594,0,1.171-.114,1.714-.338.386-.156.821.025.979.407.158.383-.024.821-.407.979-.725.299-1.495.451-2.286.451Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default atSign;
