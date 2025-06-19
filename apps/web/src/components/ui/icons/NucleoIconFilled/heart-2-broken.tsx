import type { iconProps } from './iconProps';

function heart2Broken(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart 2 broken';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.841,5.365c-.217-.827-.693-1.595-1.34-2.163-1.101-.965-2.531-1.36-3.928-1.09l-2.802,4.649,2.132,1.357c.192,.122,.318,.325,.343,.551,.025,.227-.054,.452-.215,.612l-2,2c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061l1.339-1.339-1.961-1.248c-.343-.219-.45-.671-.239-1.02l1.852-3.073c-.027-.03-.055-.061-.083-.091-1.734-1.825-4.629-1.9-6.456-.167-1.825,1.734-1.9,4.63-.163,6.459l5.48,5.694c.333,.346,.781,.537,1.261,.537h0c.48,0,.928-.191,1.26-.537l5.48-5.694s.002-.002,.003-.003c1.102-1.16,1.513-2.795,1.098-4.374Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default heart2Broken;
