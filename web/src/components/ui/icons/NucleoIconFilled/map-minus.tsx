import type { iconProps } from './iconProps';

function mapMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px map minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10,14.75c0-1.241,1.009-2.25,2.25-2.25h4.75V4.997c0-.534-.239-1.031-.655-1.365-.416-.333-.953-.459-1.475-.343l-2.999,.666c-.047,.01-.094,.007-.139-.009l-4.952-1.801c-.314-.114-.653-.136-.978-.063l-3.432,.762c-.807,.179-1.371,.882-1.371,1.708V13.003c0,.534,.239,1.031,.655,1.365s.953,.458,1.475,.343l2.999-.666c.047-.01,.095-.007,.139,.009l3.857,1.403c-.075-.224-.125-.459-.125-.707Z"
          fill="currentColor"
        />
        <path
          d="M17.25,14h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default mapMinus;
