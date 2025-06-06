import type { iconProps } from './iconProps';

function circleImage(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle image';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.194,8.384c-1.072-1.072-2.816-1.072-3.889,0L3.726,13.964c1.322,1.404,3.193,2.286,5.274,2.286,3.266,0,6.025-2.159,6.933-5.128l-2.738-2.738Z"
          fill="currentColor"
        />
        <path
          d="M9,17c-4.411,0-8-3.589-8-8S4.589,1,9,1s8,3.589,8,8-3.589,8-8,8Zm0-14.5c-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5,6.5-2.916,6.5-6.5-2.916-6.5-6.5-6.5Z"
          fill="currentColor"
        />
        <circle cx="6.25" cy="7.25" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default circleImage;
