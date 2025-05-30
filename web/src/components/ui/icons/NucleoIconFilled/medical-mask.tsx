import type { iconProps } from './iconProps';

function medicalMask(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px medical mask';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.25,13.25h-1c-1.517,0-2.75-1.233-2.75-2.75v-3c0-1.517,1.233-2.75,2.75-2.75h1c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-1c-.689,0-1.25,.561-1.25,1.25v3c0,.689,.561,1.25,1.25,1.25h1c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.75,13.25h-1c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1c.689,0,1.25-.561,1.25-1.25v-3c0-.689-.561-1.25-1.25-1.25h-1c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1c1.517,0,2.75,1.233,2.75,2.75v3c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
        />
        <path
          d="M14.072,4.823c-1.759-.838-3.153-1.323-5.072-1.323s-3.313,.485-5.072,1.323c-.261,.125-.428,.388-.428,.677v7c0,.289,.167,.553,.428,.677,1.759,.838,3.153,1.323,5.072,1.323s3.313-.485,5.072-1.323c.261-.125,.428-.388,.428-.677V5.5c0-.289-.167-.553-.428-.677Zm-2.66,6.409c-.8,.178-1.606,.267-2.413,.267s-1.612-.089-2.413-.267c-.404-.089-.659-.49-.569-.895,.089-.404,.487-.66,.895-.569,1.385,.307,2.79,.307,4.175,0,.403-.09,.805,.165,.895,.569,.09,.404-.165,.805-.569,.895Zm.569-3.569c-.09,.404-.49,.658-.895,.569-1.384-.307-2.789-.308-4.175,0-.055,.012-.109,.018-.163,.018-.344,0-.654-.238-.731-.587-.09-.404,.165-.805,.569-.895,1.602-.356,3.226-.356,4.825,0,.404,.09,.659,.49,.569,.895Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default medicalMask;
