import type { iconProps } from './iconProps';

function shareRight3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share right 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.243,2.185c-.222-.194-.536-.238-.804-.117-.268,.122-.439,.389-.439,.683v3.022C1.095,6.244,1,14.167,1,14.25c0,.324,.208,.61,.516,.711,.307,.102,.645-.007,.838-.266,.099-.133,2.351-3.1,6.646-3.418v2.973c0,.296,.174,.564,.444,.685,.098,.043,.202,.065,.306,.065,.182,0,.36-.066,.501-.192l6.5-5.833c.16-.144,.251-.349,.249-.563s-.095-.419-.257-.56L10.243,2.185Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shareRight3;
