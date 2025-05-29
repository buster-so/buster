import type { iconProps } from './iconProps';

function phoneMsg(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px phone msg';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.75,1h-3.5c-1.24,0-2.25,1.009-2.25,2.25v1.5c0,1.156,.877,2.111,2,2.236v1.264c0,.296,.174,.564,.444,.685,.099,.043,.202,.065,.306,.065,.182,0,.36-.066,.501-.192l2.013-1.808h.486c1.24,0,2.25-1.009,2.25-2.25v-1.5c0-1.241-1.01-2.25-2.25-2.25Z"
          fill="currentColor"
        />
        <path
          d="M15.479,11.232l-2.926-1.299c-.713-.317-1.551-.114-2.04,.494l-1.367,1.701c-1.307-.854-2.423-1.971-3.277-3.28l1.705-1.358c.609-.488,.813-1.327,.497-2.04l-1.3-2.928c-.343-.772-1.185-1.178-2.004-.967l-2.476,.643c-.846,.22-1.393,1.04-1.273,1.907,.934,6.649,6.229,11.945,12.88,12.879,.08,.011,.158,.016,.236,.016,.774,0,1.468-.522,1.669-1.29l.642-2.476c.211-.817-.195-1.659-.966-2.002Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default phoneMsg;
