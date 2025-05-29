import type { iconProps } from './iconProps';

function makeupBrush(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px makeup brush';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.069,1.921h0c-.79-.788-2.166-.789-2.957,0l-4.495,4.495c.144,.09,.281,.192,.403,.314l2.25,2.25c.12,.12,.21,.26,.298,.4l4.502-4.502c.815-.815,.815-2.142,0-2.958Z"
          fill="currentColor"
        />
        <path
          d="M10.208,10.042l-2.25-2.25c-.208-.208-.52-.275-.795-.171L1.735,9.673c-.292,.11-.485,.39-.485,.702,0,1.862,.807,3.534,2.084,4.7l2.584-3.235c.258-.323,.73-.376,1.054-.118,.323,.258,.376,.73,.118,1.054l-2.539,3.179c.913,.505,1.96,.794,3.075,.794,.312,0,.591-.193,.702-.485l2.053-5.428c.104-.275,.037-.587-.171-.795Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default makeupBrush;
