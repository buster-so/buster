import type { iconProps } from './iconProps';

function arrowRotateAnticlockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow rotate anticlockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,17c-2.653,0-5.127-1.311-6.62-3.508-.233-.342-.144-.809,.199-1.042,.342-.232,.809-.145,1.042,.199,1.213,1.785,3.225,2.851,5.38,2.851,3.584,0,6.5-2.916,6.5-6.5s-2.916-6.5-6.5-6.5c-2.585,0-4.924,1.531-5.959,3.9-.167,.379-.608,.553-.988,.387s-.553-.608-.387-.988C2.94,2.884,5.819,1,9,1c4.411,0,8,3.589,8,8s-3.589,8-8,8Z"
          fill="currentColor"
        />
        <path
          d="M2.287,7c-.369,0-.69-.272-.742-.647l-.408-2.945c-.057-.411,.229-.789,.64-.846,.41-.06,.789,.229,.846,.64l.305,2.202,2.201-.305c.407-.054,.789,.23,.846,.641,.057,.41-.23,.789-.641,.846l-2.944,.407c-.035,.004-.069,.007-.104,.007Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowRotateAnticlockwise;
