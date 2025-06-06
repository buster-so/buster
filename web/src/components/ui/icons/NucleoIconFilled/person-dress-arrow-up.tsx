import type { iconProps } from './iconProps';

function personDressArrowUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px person dress arrow up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="6.001" cy="2.5" fill="currentColor" r="2.5" />
        <path
          d="M9.141,7.404c-.183-.664-.741-1.162-1.419-1.267-1.127-.178-2.297-.178-3.43-.002-.686,.107-1.248,.604-1.431,1.269l-1.659,6.014c-.104,.379-.028,.776,.21,1.09,.239,.313,.601,.493,.995,.493h.904l.116,1.396c.076,.9,.842,1.604,1.744,1.604h1.66c.903,0,1.669-.705,1.744-1.604l.116-1.396h.903c.394,0,.756-.18,.995-.493,.238-.313,.315-.71,.21-1.089l-1.659-6.014Z"
          fill="currentColor"
        />
        <path
          d="M14.78,4.47c-.293-.293-.768-.293-1.061,0l-2.25,2.25c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l.97-.97v6.189c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V6.811l.97,.97c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.25-2.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default personDressArrowUp;
