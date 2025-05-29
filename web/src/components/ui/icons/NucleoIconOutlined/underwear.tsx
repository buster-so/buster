import type { iconProps } from './iconProps';

function underwear(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px underwear';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.976 6.75L2.024 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.688,6.75c.065,.467,.161,1.62-.438,2.875-.46,.965-1.121,1.55-1.492,1.833"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.312,6.75c-.065,.467-.161,1.62,.438,2.875,.46,.965,1.121,1.55,1.492,1.833"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.822,3.75H3.178c-.523,0-.958,.403-.997,.925l-.43,5.725c2.577,.205,4.715,1.967,5.463,4.35h3.574c.748-2.383,2.886-4.145,5.463-4.35l-.43-5.725c-.039-.522-.474-.925-.997-.925Z"
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

export default underwear;
