import type { iconProps } from './iconProps';

function pizza(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pizza';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="7.25" cy="8.25" fill="currentColor" r=".75" />
        <circle cx="10.75" cy="10.25" fill="currentColor" r=".75" />
        <circle cx="7.75" cy="10.75" fill="currentColor" r=".75" />
        <path
          d="M13.918,8.191c.043,.265,.082,.532,.082,.809,0,2.761-2.239,5-5,5s-5-2.239-5-5c0-2.235,1.477-4.105,3.5-4.746V1.146C3.804,1.851,1,5.102,1,9c0,4.411,3.589,8,8,8s8-3.589,8-8c0-.828-.127-1.627-.361-2.379l-2.72,1.571Z"
          fill="currentColor"
        />
        <path
          d="M16.679,3.999C15.252,1.532,12.598,0,9.75,0c-.414,0-.75,.336-.75,.75v7.25c0,.268,.143,.516,.375,.649,.116,.067,.245,.101,.375,.101s.259-.034,.375-.101l6.279-3.625c.172-.1,.298-.263,.35-.456s.024-.397-.075-.569Zm-6.179-.682c1.147,.186,2.191,.79,2.927,1.694l-2.927,1.69V3.317Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default pizza;
