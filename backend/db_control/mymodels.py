from sqlalchemy import create_engine, Integer, String, Text, LargeBinary, Date, DateTime, Boolean, Float, Numeric, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, mapped_column, Mapped
from datetime import datetime, date

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, nullable=False)
    user_name: Mapped[str] = mapped_column(String(50), nullable=False)
    user_mail: Mapped[str] = mapped_column(String(255), nullable=False)
    user_password: Mapped[str] = mapped_column(String(255), nullable=False)
    user_picture: Mapped[bytes] = mapped_column(LargeBinary, nullable=True)
    user_profile: Mapped[str] = mapped_column(Text)
    birthdate: Mapped[date] = mapped_column(Date)
    gender: Mapped[str] = mapped_column(String(50))
    posts = relationship("Post", back_populates="users")
    favorites = relationship("Favorite", back_populates="users")
    preferences = relationship("Preference", back_populates="users")
    purchases = relationship("Purchase", back_populates="users")

class Post(Base):
    __tablename__ = "posts"
    post_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.user_id'))
    store_id: Mapped[int] = mapped_column(Integer, ForeignKey('stores.store_id'))
    review: Mapped[str] = mapped_column(Text)
    rating: Mapped[int] = mapped_column(Integer)
    users = relationship("User", back_populates="posts")
    photos = relationship("Photo", back_populates="posts")
    stores = relationship("Store", back_populates="posts")

class Photo(Base):
    __tablename__ = "photos"
    photo_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey('posts.post_id'))
    photo_data: Mapped[bytes] = mapped_column(LargeBinary, nullable=True)
    posts = relationship("Post", back_populates="photos")

class Store(Base):
    __tablename__ = "stores"
    store_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    store_name: Mapped[str] = mapped_column(String(255), nullable=False)
    store_address: Mapped[str] = mapped_column(String(255), nullable=False)
    store_contact: Mapped[str] = mapped_column(String(255), nullable=True)
    lat: Mapped[float] = mapped_column(Numeric(10, 8))
    lng: Mapped[float] = mapped_column(Numeric(11, 8))
    brand_id: Mapped[int] = mapped_column(Integer, ForeignKey('brands.brand_id'))
    posts = relationship("Post", back_populates="stores")

class Brand(Base):
    __tablename__ = "brands"
    brand_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    brand_name: Mapped[str] = mapped_column(String(255), nullable=False)
    brand_picture: Mapped[bytes] = mapped_column(LargeBinary, nullable=True)
    category: Mapped[str] = mapped_column(String(50))
    manufacturer_id: Mapped[int] = mapped_column(Integer, ForeignKey('manufacturers.manufacturer_id'))
    manufacturers = relationship("Manufacturer", back_populates="brands")
    favorites = relationship("Favorite", back_populates="brands")
    surveys = relationship("Survey", back_populates="brands")
    survey_raw_datas = relationship("SurveyRawData", back_populates="brands")
    ec_brands = relationship("EC_Brand", back_populates="brands")

class Manufacturer(Base):
    __tablename__ = "manufacturers"
    manufacturer_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    manufacturer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    brands = relationship("Brand", back_populates="manufacturers")

class Favorite(Base):
    __tablename__ = "favorites"
    favorite_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.user_id'))
    brand_id: Mapped[int] = mapped_column(Integer, ForeignKey('brands.brand_id'))
    users = relationship("User", back_populates="favorites")
    brands = relationship("Brand", back_populates="favorites")

class Preference(Base):
    __tablename__ = "preferences"
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.user_id'), primary_key=True)
    item_id: Mapped[int] = mapped_column(Integer, ForeignKey('items.item_id'), primary_key=True)
    score: Mapped[float] = mapped_column(Float)
    users = relationship("User", back_populates="preferences")
    items = relationship("Item", back_populates="preferences")

class Item(Base):
    __tablename__ = "items"
    item_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_name: Mapped[str] = mapped_column(String(255), nullable=False)
    preferences = relationship("Preference", back_populates="items")
    surveys = relationship("Survey", back_populates="items")
    survey_raw_datas = relationship("SurveyRawData", back_populates="items")

class Survey(Base):
    __tablename__ = "surveys"
    survey_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_id: Mapped[int] = mapped_column(Integer, ForeignKey('items.item_id'))
    brand_id: Mapped[int] = mapped_column(Integer, ForeignKey('brands.brand_id'))
    score: Mapped[float] = mapped_column(Float)
    age_lower_limit: Mapped[int] = mapped_column(Integer)
    age_upper_limit: Mapped[int] = mapped_column(Integer)
    gender: Mapped[str] = mapped_column(String(50))
    response_count: Mapped[int] = mapped_column(Integer)
    brands = relationship("Brand", back_populates="surveys")
    items = relationship("Item", back_populates="surveys")

class SurveyRawData(Base):
    __tablename__ = "survey_raw_datas"
    raw_data_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_id: Mapped[int] = mapped_column(Integer, ForeignKey('items.item_id'))
    brand_id: Mapped[int] = mapped_column(Integer, ForeignKey('brands.brand_id'))
    score: Mapped[float] = mapped_column(Float)
    age: Mapped[int] = mapped_column(Integer)
    gender: Mapped[str] = mapped_column(String(50))
    purchase_date: Mapped[date] = mapped_column(Date)
    brands = relationship("Brand", back_populates="survey_raw_datas")
    items = relationship("Item", back_populates="survey_raw_datas")

class EC_Brand(Base):
    __tablename__ = "ec_brands"
    ec_brand_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    brand_id: Mapped[int] = mapped_column(Integer, ForeignKey('brands.brand_id'))
    category: Mapped[str] = mapped_column(String(50))
    name: Mapped[str] = mapped_column(String(255))
    picture: Mapped[bytes] = mapped_column(LargeBinary, nullable=True)
    description: Mapped[str] = mapped_column(Text)
    price: Mapped[int] = mapped_column(Integer)
    brands = relationship("Brand", back_populates="ec_brands")
    purchase_details = relationship("PurchaseDetail", back_populates="ec_brands")

class Purchase(Base):
    __tablename__ = "purchases"
    purchase_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.user_id'))
    date_time: Mapped[datetime] = mapped_column(DateTime)
    total_amount: Mapped[int] = mapped_column(Integer)
    total_cans: Mapped[int] = mapped_column(Integer)
    survey_completion: Mapped[bool] = mapped_column(Boolean, default=False)
    users = relationship("User", back_populates="purchases")
    purchase_details = relationship("PurchaseDetail", back_populates="purchases")

class PurchaseDetail(Base):
    __tablename__ = "purchase_details"
    purchase_id: Mapped[int] = mapped_column(Integer, ForeignKey("purchases.purchase_id"), primary_key=True)
    detail_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ec_brand_id: Mapped[int] = mapped_column(Integer, ForeignKey('ec_brands.ec_brand_id'))
    category: Mapped[str] = mapped_column(String(50))
    name: Mapped[str] = mapped_column(String(255))
    price: Mapped[int] = mapped_column(Integer)
    ec_set_id: Mapped[int] = mapped_column(Integer)
    ec_brands = relationship("EC_Brand", back_populates="purchase_details")
    purchases = relationship("Purchase", back_populates="purchase_details")


class EC_Set(Base):
    __tablename__ = "ec_sets"
    ec_set_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    set_name: Mapped[str] = mapped_column(String(255))
    set_description: Mapped[str] = mapped_column(Text)
    num_of_cans: Mapped[int] = mapped_column(Integer)
    national_cans: Mapped[int] = mapped_column(Integer)
    craft_cans: Mapped[int] = mapped_column(Integer)
    national_algorithm_id: Mapped[int] = mapped_column(Integer, ForeignKey("algorithms.algorithm_id"))
    craft_algorithm_id: Mapped[int] = mapped_column(Integer, ForeignKey("algorithms.algorithm_id"))
    national_algorithm = relationship("Algorithm", foreign_keys=[national_algorithm_id], back_populates="ec_sets_national")
    craft_algorithm = relationship("Algorithm", foreign_keys=[craft_algorithm_id], back_populates="ec_sets_craft")

class Algorithm(Base):
    __tablename__ = "algorithms"
    algorithm_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    algorithm_func: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    ec_sets_national = relationship("EC_Set", foreign_keys="[EC_Set.national_algorithm_id]", back_populates="national_algorithm")
    ec_sets_craft = relationship("EC_Set", foreign_keys="[EC_Set.craft_algorithm_id]", back_populates="craft_algorithm")