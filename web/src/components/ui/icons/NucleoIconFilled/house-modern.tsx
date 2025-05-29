import type { iconProps } from './iconProps';

function houseModern(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house modern';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="12" cy="8" fill="none" r="1" />
        <path
          d="M17.53,5.792l-.988-.397h-.002s-1.041-.42-1.041-.42v-1.475c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v.872L7.03,1.566c-.384-.156-.822,.032-.976,.416-.155,.384,.031,.821,.416,.976l.53,.213v12.829h3.75v-3.5c0-.69,.56-1.25,1.25-1.25s1.25,.56,1.25,1.25v3.5h2c.965,0,1.75-.785,1.75-1.75V7.19c.082,.029,.167,.048,.25,.048,.297,0,.579-.177,.696-.47,.155-.384-.031-.821-.416-.976Zm-5.53,3.208c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
        <path
          d="M5.5,14.5v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.25c-.138,0-.25-.112-.25-.25v-5.157l4.5-1.812v-1.617L.47,8.292c-.384,.155-.57,.592-.416,.976,.118,.292,.399,.47,.696,.47,.083,0,.167-.019,.25-.048v4.56c0,.965,.785,1.75,1.75,1.75H7v-1.5h-1.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default houseModern;
