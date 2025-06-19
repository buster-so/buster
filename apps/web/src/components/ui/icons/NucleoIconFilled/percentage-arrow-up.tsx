import type { iconProps } from './iconProps';

function percentageArrowUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px percentage arrow up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.75,12.5c-1.241,0-2.25,1.009-2.25,2.25s1.009,2.25,2.25,2.25,2.25-1.009,2.25-2.25-1.009-2.25-2.25-2.25Zm0,3c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11,9.25c0-1.241-1.009-2.25-2.25-2.25s-2.25,1.009-2.25,2.25,1.009,2.25,2.25,2.25,2.25-1.009,2.25-2.25Zm-3,0c0-.414,.336-.75,.75-.75s.75,.336,.75,.75-.336,.75-.75,.75-.75-.336-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.183,7.137c-.338-.238-.806-.159-1.045,.18l-6,8.5c-.239,.338-.158,.807,.18,1.045,.131,.093,.282,.137,.432,.137,.235,0,.467-.11,.613-.317l6-8.5c.239-.338,.158-.807-.18-1.045Z"
          fill="currentColor"
        />
        <path
          d="M6.72,5.28c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061L4.78,1.22c-.293-.293-.768-.293-1.061,0L.72,4.22c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l1.72-1.72v12.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.561l1.72,1.72Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default percentageArrowUp;
