import type { iconProps } from './iconProps';

function volumeDisabled(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px volume disabled';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.312,13.076l-.025-.013-.345-.341-.017-.032c-.923-1.019-1.426-2.318-1.426-3.689,0-2.327,1.454-4.316,3.5-5.118v-1.219c0-.457-.249-.877-.65-1.097-.4-.219-.888-.203-1.273,.044l-5.295,3.389H2.25c-1.241,0-2.25,1.009-2.25,2.25v3.5c0,1.241,1.009,2.25,2.25,2.25h2.531l5.295,3.389c.205,.131,.439,.198,.675,.198,.206,0,.412-.051,.599-.153,.401-.219,.65-.64,.65-1.097v-1.214c-.615-.241-1.186-.592-1.688-1.046Z"
          fill="currentColor"
        />
        <path
          d="M14,5c-2.206,0-4,1.794-4,4,0,1.095,.444,2.088,1.16,2.811,.005,.005,.006,.012,.011,.017s.012,.007,.017,.011c.723,.716,1.716,1.16,2.811,1.16,2.206,0,4-1.794,4-4s-1.794-4-4-4Zm0,1.5c.416,0,.802,.112,1.147,.292l-3.355,3.355c-.18-.345-.292-.732-.292-1.147,0-1.378,1.122-2.5,2.5-2.5Zm0,5c-.416,0-.802-.112-1.147-.292l3.355-3.355c.18,.345,.292,.732,.292,1.147,0,1.378-1.122,2.5-2.5,2.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default volumeDisabled;
