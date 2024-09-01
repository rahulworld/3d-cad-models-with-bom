import Loader from "react-js-loader";
const SpinnerLoader = () => {
  return (
    <div>
      <Loader
        type="spinner-default"
        bgColor={"#ff5733"}
        color={"#ff5733"}
        title={"Please wait loading for best experience ..."}
        size={100}
      />
    </div>
  );
};

export default SpinnerLoader;
