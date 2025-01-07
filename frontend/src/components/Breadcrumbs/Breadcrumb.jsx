import "./Breadcrumb.css";
import arrow_icon from "../assets/breadcrum_arrow.png";

export const Breadcrumb = (props) => {
  const { product } = props;
  return (
    <div className="bradcrum">
      HOME <img src={arrow_icon} alt="" /> SHOP <img src={arrow_icon} alt="" />{" "}
      {product.category} <img src={arrow_icon} alt="" /> {product.name}
    </div>
  );
};
