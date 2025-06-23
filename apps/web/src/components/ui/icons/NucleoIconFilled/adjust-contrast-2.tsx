import type { iconProps } from './iconProps';

function adjustContrast2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px adjust contrast 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.712,2.288l-7.425,7.425c2.05,2.05,5.374,2.05,7.425,0s2.05-5.374,0-7.425Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m1.757,10.243C-.582,7.903-.582,4.097,1.757,1.757S7.903-.582,10.243,1.757s2.34,6.146,0,8.485-6.146,2.34-8.485,0Zm7.425-7.425c-1.755-1.755-4.609-1.755-6.364,0s-1.755,4.609,0,6.364,4.609,1.755,6.364,0,1.755-4.609,0-6.364Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default adjustContrast2;
