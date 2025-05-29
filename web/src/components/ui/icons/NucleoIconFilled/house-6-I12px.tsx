import type { iconProps } from './iconProps';

function house6(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house 6';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.999,7.75c-.156,0-.314-.049-.449-.15L9,2.688,2.45,7.6c-.331,.25-.803,.181-1.05-.15-.249-.332-.182-.802,.149-1.05L8.55,1.15c.268-.2,.633-.2,.9,0l7,5.25c.331,.249,.398,.719,.149,1.05-.146,.196-.372,.3-.601,.3Z"
          fill="currentColor"
        />
        <path
          d="M14.649,8.8l-5.649-4.238L3.351,8.8c-.111,.083-.229,.152-.351,.213v5.237c0,1.517,1.233,2.75,2.75,2.75h2.5v-3.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.75h2.5c1.517,0,2.75-1.233,2.75-2.75v-5.237c-.122-.061-.24-.13-.351-.213Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default house6;
