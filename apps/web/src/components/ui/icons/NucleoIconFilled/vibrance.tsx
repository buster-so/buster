import type { iconProps } from './iconProps';

function vibrance(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px vibrance';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.332,2.852c-.319-.533-.881-.852-1.502-.852H3.17c-.621,0-1.183,.318-1.502,.852-.319,.533-.334,1.178-.041,1.725L7.458,15.458c.305,.57,.896,.924,1.542,.924s1.237-.354,1.542-.924l5.83-10.882c.293-.547,.278-1.192-.041-1.725Zm-7.332,6.898c-1.103,0-2-.897-2-2s.897-2,2-2,2,.897,2,2-.897,2-2,2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default vibrance;
