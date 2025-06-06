import type { iconProps } from './iconProps';

function label2Plus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px label 2 plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M18.333,8.528l-3.95-4.88c-.334-.412-.83-.648-1.36-.648H5.25c-1.517,0-2.75,1.233-2.75,2.75v3.888c.236-.084,.486-.138,.75-.138,1.241,0,2.25,1.009,2.25,2.25v.25h.25c1.241,0,2.25,1.009,2.25,2.25,0,.264-.054,.514-.138,.75h5.161c.53,0,1.026-.236,1.36-.649l3.95-4.879c.223-.275,.223-.668,0-.943Z"
          fill="currentColor"
        />
        <path
          d="M5.75,13.5h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75H.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default label2Plus;
