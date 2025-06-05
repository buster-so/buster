import type { iconProps } from './iconProps';

function label2Minus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px label 2 minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M18.333,8.528l-3.95-4.88c-.334-.412-.83-.648-1.36-.648H5.25c-1.517,0-2.75,1.233-2.75,2.75v6.25h3.25c1.241,0,2.25,1.009,2.25,2.25,0,.264-.054,.514-.138,.75h5.161c.53,0,1.026-.236,1.36-.649l3.95-4.879c.223-.275,.223-.668,0-.943Z"
          fill="currentColor"
        />
        <path
          d="M5.75,15H.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H5.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default label2Minus;
