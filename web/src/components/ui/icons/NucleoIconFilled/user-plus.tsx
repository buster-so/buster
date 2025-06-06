import type { iconProps } from './iconProps';

function userPlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M12.5,16.25v-.25h-.25c-1.24,0-2.25-1.009-2.25-2.25s1.01-2.25,2.25-2.25h.25v-.25c0-.409,.118-.787,.309-1.118-1.112-.724-2.429-1.132-3.809-1.132-2.765,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.592,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,1.191,0,2.375-.135,3.536-.39-.019-.118-.036-.237-.036-.36Z"
          fill="currentColor"
        />
        <path
          d="M17.25,13h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userPlus;
