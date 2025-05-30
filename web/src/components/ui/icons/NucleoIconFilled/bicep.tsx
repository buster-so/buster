import type { iconProps } from './iconProps';

function bicep(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bicep';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.328,8.736c-2.181-1.119-5.363-.277-7.083,.955-.18-.257-.37-.484-.547-.697-.58-.695-1.021-1.225-.875-2.453,.177,.007,.366-.009,.557-.061,.682-.203,1.291-.592,1.817-1.199,.328-.48,.346-1.092,.092-1.583,.274-.744,.259-1.616-.383-2.136-.61-.495-1.58-.563-2.537-.563-2.01,0-3.189,3.831-3.825,7.045-.683,3.474,.414,6.861,1.167,7.627,1.063,1.083,3.287,.99,3.987,.928,.674,.259,1.784,.399,3.13,.399,.167,0,.338-.002,.512-.006,1.702,0,3.516-.499,4.734-1.298,1.065-.699,1.657-1.947,1.583-3.338-.082-1.538-.975-2.925-2.329-3.621Zm-.654,4.179c-1.011,.693-2.281,1.065-3.487,1.065-.59,0-1.164-.089-1.686-.272-.391-.137-.596-.565-.458-.957,.138-.39,.565-.594,.957-.458,1.123,.396,2.731,.137,3.827-.615,.342-.233,.809-.147,1.043,.194,.234,.342,.147,.809-.194,1.043Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bicep;
