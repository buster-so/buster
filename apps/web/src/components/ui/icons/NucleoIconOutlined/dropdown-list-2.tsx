import type { iconProps } from './iconProps';

function dropdownList2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dropdown list 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75 12.25L14.25 12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 15.25L14.25 15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14,5h-2.5c-.158,0-.302,.089-.373,.23-.07,.141-.055,.31,.039,.436l1.25,1.667c.079,.105,.202,.167,.333,.167s.255-.062,.333-.167l1.25-1.667c.095-.126,.11-.295,.039-.436-.071-.141-.215-.23-.373-.23Z"
          fill="currentColor"
        />
        <path
          d="M9.25 2.75L9.25 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="6.5"
          width="14.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default dropdownList2;
