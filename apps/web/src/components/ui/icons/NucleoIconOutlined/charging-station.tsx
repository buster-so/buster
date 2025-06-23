import type { iconProps } from './iconProps';

function chargingStation(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px charging station';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,15.75V4.25c0-1.105,.895-2,2-2h4.5c1.105,0,2,.895,2,2V15.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.25 15.75L12.75 15.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25,4.75v1.5c0,.828-.672,1.5-1.5,1.5h0c-.828,0-1.5-.672-1.5-1.5v-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.939,8.261c-.088-.161-.256-.261-.439-.261h-1.102l.526-1.864c.067-.238-.05-.489-.275-.591-.225-.102-.492-.024-.626,.184l-1.942,3c-.099,.154-.107,.35-.02,.511,.088,.161,.256,.261,.439,.261h1.102l-.526,1.864c-.067,.238,.05,.489,.275,.591,.066,.03,.137,.044,.206,.044,.165,0,.325-.082,.42-.228l1.942-3c.099-.154,.107-.35,.02-.511Z"
          fill="currentColor"
        />
        <path
          d="M13.75,13.154c.157,.057,.323,.096,.5,.096,.828,0,1.5-.672,1.5-1.5V7.75"
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

export default chargingStation;
