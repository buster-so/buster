import type { iconProps } from './iconProps';

function paperPlane4Clock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paper plane 4 clock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.817,7.876L3.351,1.922c-.453-.234-.997-.175-1.39,.148-.392,.324-.552,.849-.408,1.336l1.435,4.844H7.386c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H2.988l-1.435,4.844c-.145,.488,.016,1.012,.408,1.336,.232,.191,.518,.29,.806,.29,.199,0,.399-.047,.584-.143l5.186-2.692c.307-2.744,2.639-4.885,5.463-4.885,.506,0,.994,.074,1.459,.203-.085-.351-.311-.655-.642-.827Z"
          fill="currentColor"
        />
        <path
          d="M14,10c-2.206,0-4,1.794-4,4s1.794,4,4,4,4-1.794,4-4-1.794-4-4-4Zm2.312,4.95c-.119,.29-.398,.465-.693,.465-.096,0-.191-.018-.285-.056l-1.619-.665c-.281-.116-.465-.39-.465-.694v-1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.247l1.154,.474c.383,.157,.566,.596,.408,.979Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default paperPlane4Clock;
