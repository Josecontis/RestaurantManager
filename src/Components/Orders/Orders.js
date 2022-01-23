import "./Orders.css";

export const Orders = ({ foods }) => {
  const menuList = ["Orders", "Settings"];

  return (
    <>
      <div className={foods.length !== 0 ? "orders active" : "orders"}>
        {console.log(foods)}
        <ul>
          {menuList &&
            menuList.map((element, index) => {
              return (
                <li key={index} onClick={() => {}}>
                  <b></b>
                  <b></b>
                  <div></div>
                </li>
              );
            })}
        </ul>
      </div>
    </>
  );
};
