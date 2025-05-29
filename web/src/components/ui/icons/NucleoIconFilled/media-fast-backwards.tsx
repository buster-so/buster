import type { iconProps } from './iconProps';

function mediaFastBackwards(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px media fast backwards';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.385,3.767c-.387-.227-.848-.233-1.24-.017l-6.145,3.405v-2.311c0-.447-.23-.85-.615-1.077-.386-.227-.849-.234-1.24-.016L.645,7.906c-.397,.22-.645,.639-.645,1.094s.247,.874,.645,1.094l7.5,4.155c.19,.106,.398,.159,.605,.159,.219,0,.437-.059,.635-.175,.385-.227,.615-.63,.615-1.077v-2.311l6.145,3.404c.19,.106,.398,.159,.605,.159,.219,0,.437-.059,.635-.175,.385-.227,.615-.63,.615-1.077V4.844c0-.447-.23-.85-.615-1.077Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default mediaFastBackwards;
