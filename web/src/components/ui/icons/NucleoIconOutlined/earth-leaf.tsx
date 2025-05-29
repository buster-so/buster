import type { iconProps } from './iconProps';

function earthLeaf(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px earth leaf';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.068,16.186c2.402-1.306,2.847-5.482,1.206-8.47-1.124,2.348-3.716,1.995-5.167,3.783-.43,.53-.761,1.25-.761,2.026,0,1.037,.512,1.954,1.297,2.509"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.36,17.25s3.023-.832,4.931-4.274"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.771,9.887c-.044-.065-.855-1.323-.24-2.575,.067-.137,.484-.949,1.344-1.188,1.273-.353,2.203,.919,2.805,.535,.673-.429-.27-2.156,.507-3.129,.592-.741,1.896-.686,2.883-.531"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.771,9.887c1.589-.439,2.611-.224,3.292,.175"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.852,13.783c-.297-.162-.601-.282-.837-.674-.418-.694,.014-1.185-.297-2.047-.292-.809-.961-1.174-1.463-1.541-.836-.611-1.874-1.711-2.688-3.859"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.307,5.433c-1.246-2.198-3.601-3.683-6.307-3.683C4.996,1.75,1.75,4.996,1.75,9c0,3.381,2.318,6.213,5.448,7.015"
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

export default earthLeaf;
