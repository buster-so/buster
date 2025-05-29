import type { iconProps } from './iconProps';

function playRotateClockwise2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px play rotate clockwise 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m16.25,8.25c-.414,0-.75.336-.75.75,0,3.584-2.916,6.5-6.5,6.5s-6.5-2.916-6.5-6.5,2.916-6.5,6.5-6.5c2.171,0,4.143,1.055,5.346,2.804l-1.475-.204c-.407-.06-.789.229-.846.641-.057.41.23.789.641.846l2.944.407c.035.005.069.007.104.007.369,0,.69-.271.742-.647l.408-2.945c.057-.41-.229-.788-.64-.846-.417-.06-.789.229-.846.641l-.117.842c-1.497-1.901-3.766-3.044-6.261-3.044C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m12.03,7.921l-3.651-2.129c-.385-.225-.865-.228-1.252-.005-.387.223-.627.638-.627,1.084v4.259c0,.446.24.861.627,1.084.192.11.408.165.623.165.218,0,.436-.057.63-.17l3.65-2.128c.389-.226.621-.629.621-1.079,0-.45-.231-.854-.62-1.081h0Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default playRotateClockwise2;
