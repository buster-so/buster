import type { iconProps } from './iconProps';

function signature3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px signature 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.25,13H.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H17.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M3.561,7.5l1.22-1.22c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-1.22,1.22-1.22-1.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.22,1.22L.22,8.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l1.22-1.22,1.22,1.22c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.22-1.22Z"
          fill="currentColor"
        />
        <path
          d="M10.854,16.25c-1.151,0-2.219-.633-2.706-1.651-1.102-2.421,.539-5.515,2.65-7.512,.229-.216,.457-.415,.683-.594-.579-1.811-1.425-3.119-2.317-3.225-.834-.1-1.44,.224-1.616,.864-.191,.695,.153,1.688,1.36,2.226,.378,.168,.549,.611,.38,.99-.168,.378-.611,.55-.99,.38-1.928-.857-2.565-2.658-2.197-3.994,.379-1.376,1.654-2.146,3.239-1.956,1.556,.185,2.709,1.785,3.444,3.875,.976-.479,1.866-.56,2.553-.201,.943,.494,1.069,1.519,1.152,2.196,.013,.108,.03,.246,.05,.364,.022-.028,.047-.062,.072-.1,.226-.347,.69-.446,1.038-.219,.347,.226,.445,.69,.219,1.038-.451,.694-1.101,1.023-1.733,.888-.941-.207-1.058-1.158-1.135-1.787-.068-.557-.13-.931-.359-1.05-.254-.135-.774-.031-1.427,.34,.467,1.933,.625,4.073,.465,5.842-.17,1.875-.993,3.027-2.317,3.245-.171,.028-.341,.042-.51,.042Zm1.045-8.139c-.023,.021-.046,.043-.07,.065-1.722,1.629-3.072,4.14-2.322,5.788,.267,.557,.932,.875,1.614,.764,.75-.123,.994-1.102,1.066-1.9,.141-1.553,.016-3.218-.288-4.717Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default signature3;
