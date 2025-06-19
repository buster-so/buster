import type { iconProps } from './iconProps';

function tableRowMergeTop(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table row merge top';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.268,2.449c-.383-.151-.821,.034-.974,.419-.153,.385,.034,.821,.419,.975,.478,.19,.787,.645,.787,1.158v4H3.5V5c0-.513,.31-.967,.787-1.158,.385-.153,.572-.59,.419-.975-.152-.385-.591-.57-.974-.419-1.053,.419-1.732,1.421-1.732,2.551V13.25c0,1.516,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.234,2.75-2.75V5c0-1.13-.68-2.132-1.732-2.551Z"
          fill="currentColor"
        />
        <path
          d="M7.03,3.78l1.22-1.22v3.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.561l1.22,1.22c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061L9.53,.22c-.293-.293-.768-.293-1.061,0l-2.5,2.5c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableRowMergeTop;
