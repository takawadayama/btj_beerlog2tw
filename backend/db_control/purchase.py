import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from db_control.mymodels import Purchase, PurchaseDetail
from db_control.connect import get_db
from db_control.token import get_current_user_id
from fastapi import APIRouter, Depends, HTTPException, Query

from db_control.schemas import PurchaseSetItem, TransactionResponse
from typing import List

# from .mymodels import Survey, Brand, Preference, User, EC_Brand, EC_Set

from scipy.spatial.distance import cosine
from datetime import date, datetime

router = APIRouter()


@router.post("/purchase", response_model=TransactionResponse)
def create_purchase(purchase: List[PurchaseSetItem], db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    try:
        total_amount = 0

        # print("Starting transaction processing...")

        # print(f"Received purchase data: {purchase}")

        # 取引テーブルへ登録
        transaction = Purchase(
            user_id=user_id,
            date_time=datetime.now(),
            total_amount=0,
            total_cans=sum(item.setDetails.cans for item in purchase),
            survey_completion=False,
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        purchase_id = transaction.purchase_id

        # 取引明細へ登録
        detail_id = 0
        for id1, set in enumerate(purchase):
            # ナショナルについて書き込み
            for id2, item in enumerate(set.national_set.details):
                for count in range(item.count):
                    detail_id += 1
                    detail = PurchaseDetail(
                        purchase_id=purchase_id,
                        ec_set_id=item.ec_set_id,
                        detail_id=detail_id,
                        ec_brand_id=item.ec_brand_id,
                        category=item.category,
                        name=item.name,
                        price=item.price,
                    )
                    db.add(detail)
                    total_amount += item.price
                    # ナショナルについて書き込み

            for id2, item in enumerate(set.craft_set.details):
                for count in range(item.count):
                    detail_id += 1
                    detail = PurchaseDetail(
                        purchase_id=purchase_id,
                        ec_set_id=item.ec_set_id,
                        detail_id=detail_id,
                        ec_brand_id=item.ec_brand_id,
                        category=item.category,
                        name=item.name,
                        price=item.price,
                    )
                    db.add(detail)
                    total_amount += item.price

        # 取引テーブルを更新
        transaction.total_amount = total_amount
        db.commit()

    except Exception as e:
        db.rollback()
        # print(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

    return TransactionResponse(total_amount=total_amount)
