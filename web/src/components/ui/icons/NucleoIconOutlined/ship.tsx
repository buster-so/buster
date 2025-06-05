import type { iconProps } from './iconProps';

function ship(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ship';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,15.75c1.401,.007,2.731-.613,3.625-1.692,1.678,2.002,4.661,2.265,6.663,.587,.212-.178,.409-.374,.587-.587,.894,1.078,2.224,1.699,3.625,1.692"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.204,12.715l-.453-1.585c-.142-.498,.119-1.022,.603-1.208l5.646-2.172,5.646,2.172c.483,.186,.745,.71,.603,1.208l-.453,1.585"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25,9.279V5.25c0-.552,.448-1,1-1h7.5c.552,0,1,.448,1,1v4.029"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 1.75H10.25V4.25H7.75z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 7.75L9 12.715"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default ship;
