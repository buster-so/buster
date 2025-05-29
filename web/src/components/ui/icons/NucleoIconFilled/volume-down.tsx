import type { iconProps } from './iconProps';

function volumeDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px volume down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.35,1.567c-.4-.219-.888-.203-1.273,.044l-5.295,3.389H3.75c-1.241,0-2.25,1.009-2.25,2.25v3.5c0,1.241,1.009,2.25,2.25,2.25h3.031l5.295,3.389c.205,.131,.439,.198,.675,.198,.206,0,.412-.051,.599-.153,.401-.219,.65-.64,.65-1.097V2.664c0-.457-.249-.877-.65-1.097Z"
          fill="currentColor"
        />
        <path
          d="M15.134,7.056c-.293,.293-.293,.768,0,1.061,.236,.236,.366,.55,.366,.884s-.13,.647-.366,.884c-.293,.292-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.52-.519,.806-1.209,.806-1.944s-.286-1.425-.806-1.944c-.293-.293-.769-.293-1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default volumeDown;
