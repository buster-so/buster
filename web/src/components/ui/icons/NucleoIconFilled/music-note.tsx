import type { iconProps } from './iconProps';

function musicNote(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px music note';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.014,1.162l-3.5,.477h0c-.862,.118-1.513,.864-1.513,1.734v7.262c-.568-.398-1.256-.635-2-.635-1.93,0-3.5,1.57-3.5,3.5s1.57,3.5,3.5,3.5,3.5-1.57,3.5-3.5V6.405l3.987-.543c.862-.118,1.513-.864,1.513-1.734v-1.231c0-.505-.218-.986-.599-1.318-.381-.333-.894-.484-1.387-.416Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default musicNote;
