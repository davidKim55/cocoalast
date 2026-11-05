"""Visual cues (backgrounds, photo cards, ranking board, rank titles) for the 20-minute video.

Image ids refer to content/images.json / content/videos.json. FALLBACK swaps an id for an
existing one when a photo could not be found or downloaded.
"""


def BG(at, image):
    return {"at": at, "type": "bg", "image": image}


def CARD(at, image):
    return {"at": at, "type": "card", "image": image}


def BOARD(at, current):
    return {"at": at, "type": "board", "current": current}


def RANK(at, image, rank, name):
    return {"at": at, "type": "rank", "image": image, "rank": rank, "name": name}


VISUALS = {
    "t20_intro": [
        BG("2000년 9월", "dallas"), BG("작은 회사 창업자", "bb_store"), CARD("그 작은 회사가", "netflix_env"),
        BG("8년 뒤", "bb_sign"), CARD("같은 해 야후는", "yahoo_hq"), BG("그럼 지금은", "bb_last"),
        BG("지금 버는 돈만", "dead_mall2"), BG("이 블록버스터조차", "bb_store2"), BG("끝까지 보시면", "abandoned_mall"),
        BOARD("7위부터", 0),
    ],
    "t20_r7": [
        RANK("7위,", "yahoo_hq", "7위", "야후"), BG("인터넷 처음", "yahoo_hq2"), CARD("광고 끝마다", "yahoo_logo"),
        BG("2000년 1월", "yahoo_hq"), BG("그런데 야후는", "yahoo_hq2"), CARD("2008년 마이크로소프트가", "ms_sign"),
        CARD("제리 양 최고경영자는", "yahoo_yang"), CARD("2013년엔 블로그", "yahoo_mayer"), BG("엎친 데 덮친", "dead_mall2"),
        BG("결국 2017년", "yahoo_hq"), BG("2009년 야후가 개인", "abandoned_mall"), CARD("42조 원을 과소평가라던", "yahoo_hq2"),
    ],
    "t20_r6": [
        BOARD("야후가 남이", 1), RANK("6위,", "tru_store", "6위", "토이저러스"), BG("\"나는 어른이", "tru_store"),
        BG("2000년, 인터넷 쇼핑", "amazon_fc"), CARD("당시 최고경영자는", "tru_store"), BG("아마존이 다른", "amazon_fc"),
        BG("설상가상", "dead_mall2"), CARD("2017년 9월 파산보호", "tru_closing"), BG("2018년 미국 매장", "tru_closing"),
        BG("그럼 직원들 퇴직금", "tru_former"), CARD("오래 일한 한 직원", "tru_former"),
    ],
    "t20_r5": [
        BOARD("토이저러스가 경쟁자에게", 2), RANK("5위,", "bb_bold", "5위", "블랙베리"), BG("정장 차림", "bb_bold"),
        CARD("2009년 오바마", "obama_bb"), CARD("2007년 아이폰이", "iphone_2007"), CARD("책 『루징", "balsillie"),
        BG("그런데 손님들 생각", "iphone_gen"), CARD("블랙베리는 서둘러", "bb_storm"), BG("공짜 메신저", "bb_curve"),
        BG("20%던 점유율", "bb_bold"), CARD("본사가 있던 캐나다", "rim_waterloo"), BG("여러분이라면", "rim_waterloo"),
    ],
    "t20_r4": [
        BOARD("블랙베리가 미래를", 3), RANK("4위,", "sears_tower", "4위", "시어스"), CARD("19세기 말부터", "sears_catalog"),
        CARD("크리스마스엔", "sears_wishbook"), BG("1990년 월마트", "sears_tower"), CARD("그런데 1993년", "sears_catalog"),
        BG("그리고 바로 이듬해", "amazon_fc"), BG("2005년 케이마트", "dead_mall2"), CARD("2017년 주주총회", "sears_closing"),
        BG("2018년 10월", "sears_closing"), CARD("시어스의 고향 시카고", "sears_sixcorners"), BG("2021년, 일리노이주", "abandoned_mall"),
    ],
    "t20_r3": [
        BOARD("시어스가 미래를", 4), RANK("처음에 말씀드린 그 회사", "bb_store2", "3위", "블록버스터"),
        BG("금요일 밤마다", "v_vhs_load"), CARD("테이프는 되감아서", "bb_rewind"), BG("2004년 전성기", "bb_store"),
        BG("진짜 돈줄은", "bb_shelves"), CARD("처음에 말씀드린 그 회의", "netflix_env"), BG("그런데 8년 뒤", "bb_sign"),
        BG("그런데 사실 블록버스터에게도", "bb_vhs"), BG("2010년 9월", "v_vhs_static"), CARD("2013년 11월", "bb_last2"),
        BG("그런데 2008년의", "bb_last2"), CARD("지금은 미국 오리건주", "bb_last"),
    ],
    "t20_r2": [
        BOARD("블록버스터가 한 번", 5), RANK("2위,", "nokia_hq", "2위", "노키아"), BG("떨어뜨려도", "nokia_3310"),
        BG("1865년", "nokia_hq2"), BG("2007년엔 전 세계", "nokia_n95"), CARD("그해 나온 아이폰", "iphone_2007"),
        BG("2010년엔 한 부사장", "nokia_n95b"), CARD("그런데 반년도", "elop"), BG("2012년, 1만 명", "nokia_hq"),
        CARD("공장이 있던 도시 살로", "salo"), BG("점유율은 2013년", "nokia_hq2"), CARD("그해 9월 노키아는", "ms_sign"),
        BG("몇 년 새 살로", "salo"), BG("참고로 인터넷에는", "nokia_3310"), BG("여러분은 어떻게", "nokia_hq"),
    ],
    "t20_r1": [
        BOARD("지금까지는 회사가", 6), RANK("1위,", "kodak_tower", "1위", "코닥"), CARD("돌잔치", "kodak_film2"),
        BG("1888년", "kodak_brownie"), BG("1976년", "kodak_film"), BG("본사가 있던 뉴욕주", "rochester"),
        CARD("그리고 1975년", "kodak_sasson"), BG("이걸 본 경영진은", "v_film_camera"), BG("그렇다고 코닥이", "kodak_instamatic"),
        CARD("그 사이 2010년에", "instagram"), CARD("같은 해 1월", "kodak_tower2"), BG("그 옳은 결정의", "rochester"),
        BG("파산 신청 날", "kodak_tower"), BG("걱정은 현실이", "kodak_film2"), BG("속은 건 투자자만", "kodak_film"),
        CARD("디지털카메라를 처음 만든", "kodak_sasson"), BG("필름을 지키려다", "kodak_tower2"),
    ],
    "t20_outro": [
        BOARD("일곱 곳을", 7), BG("다들 지금 버는", "abandoned_mall"), BG("그런데 손님 손엔", "iphone_gen"),
        BG("42조 원 제안을", "dead_mall2"), BG("황금알", "bb_last"), CARD("반대로 살아남은", "fuji_hq"),
        BG("고모리", "fuji_hq"), CARD("넷플릭스는 자기 돈줄", "netflix_hq2"), BG("리드 헤이스팅스", "netflix_hq"),
        BG("여러분도 한 번쯤", "dallas"), BG("그리고 여러분이 마지막으로", "dallas2"), BG("구독 눌러", "bb_last"),
    ],
}
