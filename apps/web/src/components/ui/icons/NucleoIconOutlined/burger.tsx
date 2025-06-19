import type { iconProps } from './iconProps';

function burger(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px burger';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.25,10.25c-1.065,0-1.352,1-2.417,1s-1.352-1-2.417-1-1.352,1-2.417,1-1.352-1-2.417-1-1.352,1-2.417,1-1.352-1-2.417-1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,7.75h5.898c.324,0,.564-.299,.488-.615-.321-1.336-1.481-4.385-5.386-4.385h-1c-.304,0-.637,0-1,0-3.905,0-5.065,3.05-5.386,4.385-.076,.316,.163,.615,.488,.615h5.898Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15,13.25s-.25,2-3.25,2c-.859,0-4.641,0-5.5,0-3,0-3.25-2-3.25-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="7.25" cy="5" fill="currentColor" r=".75" />
        <circle cx="10.75" cy="5.5" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default burger;
