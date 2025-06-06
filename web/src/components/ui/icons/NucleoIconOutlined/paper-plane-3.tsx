import type { iconProps } from './iconProps';

function paperPlane3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paper plane 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 8.614L9 13.007"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.458,2.528l5.954,11.466c.21,.404-.168,.863-.605,.733l-5.807-1.721-5.807,1.721c-.437,.129-.815-.329-.605-.733L8.542,2.528c.193-.371,.724-.371,.917,0Z"
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

export default paperPlane3;
