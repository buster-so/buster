import type { iconProps } from './iconProps';

function chartRadar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart radar';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.565,5.569L10.559,1.548c-.918-.736-2.199-.736-3.117,0L2.435,5.569c-.758,.608-1.096,1.612-.86,2.556l1.49,5.98c.276,1.115,1.271,1.894,2.418,1.894h7.035c1.146,0,2.142-.779,2.418-1.894l1.49-5.981c.235-.944-.103-1.948-.86-2.556Zm-.595,2.194l-1.49,5.981c-.111,.445-.507,.755-.963,.755H5.482c-.456,0-.852-.311-.963-.756l-1.49-5.981c-.094-.378,.041-.781,.345-1.024L8.381,2.718c.365-.293,.873-.293,1.238,0l5.007,4.021c.304,.243,.438,.646,.345,1.024Z"
          fill="currentColor"
        />
        <path
          d="M9.427,5.133c-.236-.163-.543-.178-.795-.037l-4,2.25c-.312,.176-.457,.55-.344,.891,1.588,4.763,2.146,4.763,2.445,4.763,.057,0,.113-.006,.169-.02l4.203-.972c.437-.013,.516-.221,1.815-3.673q.292-.584-3.494-3.202Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chartRadar;
