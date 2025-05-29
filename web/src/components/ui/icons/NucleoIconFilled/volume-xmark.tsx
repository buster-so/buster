import type { iconProps } from './iconProps';

function volumeXmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px volume xmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.35,1.567c-.4-.219-.889-.203-1.273,.044l-5.295,3.389H2.25c-1.241,0-2.25,1.009-2.25,2.25v3.5c0,1.241,1.009,2.25,2.25,2.25h2.531l5.295,3.389c.205,.131,.439,.198,.675,.198,.206,0,.412-.051,.599-.153,.401-.219,.65-.64,.65-1.097V2.664c0-.457-.249-.877-.65-1.097Z"
          fill="currentColor"
        />
        <path
          d="M16.561,9l1.22-1.22c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-1.22,1.22-1.22-1.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.22,1.22-1.22,1.22c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l1.22-1.22,1.22,1.22c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.22-1.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default volumeXmark;
