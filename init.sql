--
-- PostgreSQL database dump
--

\restrict xgpF58ReJuji9duvrxN7crCQaVsDAl4DrS1qSldNjAnfdbYHVejCVQKVDd6ScJp

-- Dumped from database version 13.23
-- Dumped by pg_dump version 18.1

-- Started on 2026-04-11 17:00:47

SET statement_timeout = 0;
SET lock_timeout = 0;
-- SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 209 (class 1255 OID 16433)
-- Name: get_productcode(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_productcode(pid integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
   pc TEXT;
BEGIN
   SELECT ProductCode 
   INTO pc
   FROM Products
   WHERE ProductId = pid;
   
   RETURN pc;
END;
$$;


ALTER FUNCTION public.get_productcode(pid integer) OWNER TO postgres;

--
-- TOC entry 206 (class 1255 OID 16411)
-- Name: get_productid(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_productid(p_productcode text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
	v_ProductId int;
BEGIN

	SELECT ProductId
	INTO v_ProductId
	FROM public.Products
	WHERE ProductCode = p_ProductCode;

	RETURN v_ProductId;
END;
$$;


ALTER FUNCTION public.get_productid(p_productcode text) OWNER TO postgres;

--
-- TOC entry 212 (class 1255 OID 16437)
-- Name: get_productinfo(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_productinfo(pid integer) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
   result JSON;
BEGIN
   SELECT json_build_object(
      'product_name', ProductName,
      'product_code', ProductCode,
      'store', Store,
      'price', Price,
      'status', Status,
      'last_scraped_product', LastScrapedProducts,
	  'last_scraped_reviews', LastScrapedReviews,
      'last_predicted', LastPredicted
   )
   INTO result
   FROM Products
   WHERE ProductID = pid;

   RETURN result;
END;
$$;


ALTER FUNCTION public.get_productinfo(pid integer) OWNER TO postgres;

--
-- TOC entry 210 (class 1255 OID 24645)
-- Name: get_reviews(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_reviews(pid integer) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
   result JSON;
BEGIN
   SELECT json_agg(
      json_build_object(
         'review_id', ReviewId,
         'version_id', VersionId,
         'review', Review,
         'rating', Rating,
		 'predicted_label', PredictedLabel,
		 'confidence_score', ConfidenceScore,
		 'predicted_at', PredictedAt
      )
   )
   INTO result
   FROM Reviews
   WHERE ProductID = pid
     AND VersionId = (
         SELECT MAX(VersionId)
         FROM Reviews
         WHERE ProductID = pid
     );

   RETURN result;
END;
$$;


ALTER FUNCTION public.get_reviews(pid integer) OWNER TO postgres;

--
-- TOC entry 207 (class 1255 OID 24648)
-- Name: get_userauth(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_userauth(u text, p text) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
   result JSON;
BEGIN
   SELECT json_build_object(
      'user_id', UserId,
      'user_role', UserRole
   )
   INTO result
   FROM Users
   WHERE username = u AND UserPassword = p;

   RETURN result;
END;
$$;


ALTER FUNCTION public.get_userauth(u text, p text) OWNER TO postgres;

--
-- TOC entry 225 (class 1255 OID 24647)
-- Name: post_predictedreview(integer, bigint, integer, text, numeric); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.post_predictedreview(pid integer, rid bigint, vid integer, pl text, c numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE Reviews
	SET PredictedLabel = pl,
		confidencescore = c,
		PredictedAt = CURRENT_TIMESTAMP
	WHERE ProductId = pid AND ReviewId = rid AND VersionId = vid;

	UPDATE Products
	SET LastPredicted = CURRENT_TIMESTAMP
	WHERE ProductId = pid;
END;
$$;


ALTER PROCEDURE public.post_predictedreview(pid integer, rid bigint, vid integer, pl text, c numeric) OWNER TO postgres;

--
-- TOC entry 208 (class 1255 OID 16414)
-- Name: post_productcode(text); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.post_productcode(p_productcode text)
    LANGUAGE plpgsql
    AS $$
BEGIN

	INSERT INTO Products
		(ProductCode)
	VALUES
		(p_ProductCode);

END;
$$;


ALTER PROCEDURE public.post_productcode(p_productcode text) OWNER TO postgres;

--
-- TOC entry 211 (class 1255 OID 16452)
-- Name: post_productinfo(integer, text, text, double precision); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.post_productinfo(pid integer, pn text, s text, p double precision)
    LANGUAGE plpgsql
    AS $$
BEGIN
	UPDATE Products
	SET ProductName = pn,
	Store = s, Price = p, 
	Status = 'scraped', 
	LastScrapedProducts = CURRENT_TIMESTAMP
	WHERE ProductId = pid;
	
END;
$$;


ALTER PROCEDURE public.post_productinfo(pid integer, pn text, s text, p double precision) OWNER TO postgres;

--
-- TOC entry 224 (class 1255 OID 16455)
-- Name: post_scrapedreview(bigint, integer, text, integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.post_scrapedreview(rid bigint, pid integer, re text, r integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO Reviews (ReviewId, ProductId, VersionId, Review, Rating)
    VALUES (
        rid,
        pid,
        COALESCE(
            (SELECT MAX(VersionId) + 1 FROM Reviews WHERE ProductId = pid),
            1
        ),
        re,
        r
    );

	UPDATE Products
	SET lastscrapedreviews = CURRENT_TIMESTAMP
	WHERE ProductId = pid;
END;
$$;


ALTER PROCEDURE public.post_scrapedreview(rid bigint, pid integer, re text, r integer) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 200 (class 1259 OID 16395)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    productid integer NOT NULL,
    productname text,
    productcode text NOT NULL,
    store text,
    price double precision,
    status text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    lastscrapedproducts timestamp without time zone,
    lastpredicted timestamp without time zone,
    lastscrapedreviews timestamp without time zone,
    CONSTRAINT status_check CHECK ((status = ANY (ARRAY['pending'::text, 'scraped'::text, 'predicted'::text, 'error'::text])))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 201 (class 1259 OID 16412)
-- Name: products_productid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.products ALTER COLUMN productid ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.products_productid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 203 (class 1259 OID 16417)
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    reviewid bigint NOT NULL,
    productid integer NOT NULL,
    versionid integer NOT NULL,
    review text,
    predictedlabel text,
    confidencescore numeric(5,4),
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    predictedat timestamp without time zone,
    rating integer
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- TOC entry 202 (class 1259 OID 16415)
-- Name: reviews_reviewid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_reviewid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_reviewid_seq OWNER TO postgres;

--
-- TOC entry 3030 (class 0 OID 0)
-- Dependencies: 202
-- Name: reviews_reviewid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_reviewid_seq OWNED BY public.reviews.reviewid;


--
-- TOC entry 205 (class 1259 OID 16443)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    userid integer NOT NULL,
    username text,
    userpassword text,
    userrole text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 204 (class 1259 OID 16441)
-- Name: users_userid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_userid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_userid_seq OWNER TO postgres;

--
-- TOC entry 3031 (class 0 OID 0)
-- Dependencies: 204
-- Name: users_userid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_userid_seq OWNED BY public.users.userid;


--
-- TOC entry 2875 (class 2604 OID 16420)
-- Name: reviews reviewid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN reviewid SET DEFAULT nextval('public.reviews_reviewid_seq'::regclass);


--
-- TOC entry 2877 (class 2604 OID 16446)
-- Name: users userid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN userid SET DEFAULT nextval('public.users_userid_seq'::regclass);


--
-- TOC entry 3018 (class 0 OID 16395)
-- Dependencies: 200
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (productid, productname, productcode, store, price, status, createdat, lastscrapedproducts, lastpredicted, lastscrapedreviews) FROM stdin;
5	\N	pdp-i5432338284-s23195260672	\N	\N	\N	2026-01-27 18:11:53.981159	\N	\N	\N
7	\N	pdp-itest-stest	\N	\N	\N	2026-01-27 18:13:20.12634	\N	\N	\N
10	แอมป์จิ๋ว แอมจิ๋วบลูทูธ แอมป์ 12v แอมป์บลูทูธ แอมจิ๋ว ชิปใหญ่ TB21 TPA3116D2 ZK MT21 502MT 2.1 ช่องบลูทูธ 5.0 เครื่องขยายเสียงสเตอริโอ บอร์ดขยายเสียงซับวูฟเฟอร์บลูทูธ ขยายเสียงลำโพง แอมป์จิ๋วแรงๆ เพราเวอร์แอมป์ ขยายเสียงบลูทูธ แอมจิ๋ว แอมป์จิ๋วบลูทูธ	pdp-i6060583359-s26296570135	nneriw	143	scraped	2026-03-05 16:20:21.967237	2026-03-05 16:39:29.511847	2026-04-10 15:18:50.563285	2026-04-07 17:20:42.963239
9	\N	pdp-i5746814435-s24484013603	\N	\N	\N	2026-01-27 18:18:14.835565	\N	\N	\N
12	\N	pdp-i606058359-s26296570135	\N	\N	\N	2026-03-05 17:05:49.825332	\N	\N	\N
1	ToySmart ของเล่นคีย์บอร์ด 61คีย์ มีไมโครโฟนในตัว เสียงเพราะ	pdp-i1124282075-s2586466812	Toy Smart Shop	1294.05	scraped	2026-01-27 15:37:17.427243	2026-03-05 17:06:43.897475	\N	\N
\.


--
-- TOC entry 3021 (class 0 OID 16417)
-- Dependencies: 203
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (reviewid, productid, versionid, review, predictedlabel, confidencescore, createdat, predictedat, rating) FROM stdin;
1016270118283359	10	1	ชิปไหญ่มันเป็นแบบนี้หรอครับ โกหกครับร้านนี้  โฆษณาเกินจริงหลอกลวง 	fake	0.5274	2026-04-07 17:20:42.932351	2026-04-10 15:18:50.522905	5
1017051969383359	10	1	ความทนทาน:ทนทานต่อโหลดหนักๆ ถึง 24โวล์\n 👌ความง่ายในการใช้:เชื่อมต่อได้ง่ายดาย\n ความเข้ากันได้:เข้ากันได้ดีกับหลายอุปกร เป็นแอมป์แอมป์จิ๋วที่มีคุณภาพดี 	fake	0.8260	2026-04-07 17:20:42.942149	2026-04-10 15:18:50.5385	5
1016039327483359	10	1	เหมาะสำหรับใช้ในบ้าน, รองรับ 2.1 ช่อง, การเชื่อมต่อ Bluetooth 5.0, การออกแบบเล็กกะทัดรัด, คุณภาพเสียงชัดเจน, กำลังขับสูง,  	fake	0.5129	2026-04-07 17:20:42.944101	2026-04-10 15:18:50.54044	5
1014872230583359	10	1	ความทนทาน:  ทนทานนานปีแน่ถ้าไม่ใช้ไฟเกิน 👌ความง่ายในการใช้:  ใช้งานง่ายมาก เสียบไฟเข้าใช้ได้เลย ความเข้ากันได้:  พอดีแป๊ะๆ 🔌การเชื่อมต่อ:  สดวกดีครับ จับง่าย 	fake	0.7195	2026-04-07 17:20:42.946549	2026-04-10 15:18:50.542116	5
1027548729583359	10	1	คุณภาพเสียงชัดเจน, คุ้มค่ากับราคา, เหมาะสำหรับใช้ในบ้าน,  	fake	0.6592	2026-04-07 17:20:42.948013	2026-04-10 15:18:50.544192	5
1019553494283359	10	1	okครับสินค้าตรงปก การขนส่งรวดเร็ว ส่วนจะใช้ได้คงทนไหมจะมารีวิวหบังจากทดลองครับ 	real	0.9611	2026-04-07 17:20:42.949182	2026-04-10 15:18:50.545753	5
1017627042983359	10	1	โครงสร้างพลาสติกทนทาน, แอมป์คลาส D, คุณภาพเสียงชัดเจน,  	fake	0.7637	2026-04-07 17:20:42.950226	2026-04-10 15:18:50.547023	5
1019834769483359	10	1	คุณภาพเสียงชัดเจน, โครงสร้างพลาสติกทนทาน,  	fake	0.7637	2026-04-07 17:20:42.95091	2026-04-10 15:18:50.547933	5
1027161783883359	10	1	โครงสร้างพลาสติกทนทาน, รองรับ 2.1 ช่อง,  	fake	0.9298	2026-04-07 17:20:42.951935	2026-04-10 15:18:50.548888	5
1027187675483359	10	1	ดีเหมือนเดิม สั่งมี 10 ชุดได้แล้ว 	real	0.6287	2026-04-07 17:20:42.953038	2026-04-10 15:18:50.550205	5
1016782828983359	10	1	คุณภาพเสียงชัดเจน, โครงสร้างพลาสติกทนทาน,  	fake	0.7637	2026-04-07 17:20:42.954268	2026-04-10 15:18:50.551545	5
1017023243183359	10	1	ติดตั้งง่าย, คุณภาพเสียงชัดเจน,  	fake	0.5155	2026-04-07 17:20:42.955001	2026-04-10 15:18:50.55269	5
1025795695783359	10	1	เร็วมากครับ 	real	0.7972	2026-04-07 17:20:42.955647	2026-04-10 15:18:50.553832	5
1023470979683359	10	1	เสียงดีเกินคาด 	fake	0.8020	2026-04-07 17:20:42.956532	2026-04-10 15:18:50.554858	5
1023110891883359	10	1	แรงดี 	real	0.5636	2026-04-07 17:20:42.957513	2026-04-10 15:18:50.556287	5
1018739759383359	10	1	ดีค้าบตรงปก 	real	0.7494	2026-04-07 17:20:42.958526	2026-04-10 15:18:50.557724	5
1023612206883359	10	1	ตรงปก ส่งไว 	real	0.9265	2026-04-07 17:20:42.959291	2026-04-10 15:18:50.558721	5
1016751189783359	10	1	ส่งใว 	fake	0.5001	2026-04-07 17:20:42.960274	2026-04-10 15:18:50.559744	5
1015303745483359	10	1	ยอดเยี่ยม	fake	0.8883	2026-04-07 17:20:42.96112	2026-04-10 15:18:50.560684	5
1017244175583359	10	1		real	0.8308	2026-04-07 17:20:42.962072	2026-04-10 15:18:50.561847	5
1017305045883359	10	1	ของ ลอกเลียนแบบ ครับ ปกติ แอม จะไม่ ความ ร้อน แต่ นี้ เปิดไป10นาที ร้อน มาก เลย ไม่ได้ เอาขับ ดอก สเปคแรงแต่ อย่างได ตัว เก่า ผม ก็ใช้ รุ่นนี้ แต่ไม่ มี ร้อน ครับ ดอก เหมือนกันหมด แต่ รุ่นนี้ คือ ร้อนมาก 	real	0.8308	2026-04-07 17:20:42.963239	2026-04-10 15:18:50.563285	1
\.


--
-- TOC entry 3023 (class 0 OID 16443)
-- Dependencies: 205
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (userid, username, userpassword, userrole) FROM stdin;
1	test	test1234	admin
\.


--
-- TOC entry 3032 (class 0 OID 0)
-- Dependencies: 201
-- Name: products_productid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_productid_seq', 12, true);


--
-- TOC entry 3033 (class 0 OID 0)
-- Dependencies: 202
-- Name: reviews_reviewid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_reviewid_seq', 1, false);


--
-- TOC entry 3034 (class 0 OID 0)
-- Dependencies: 204
-- Name: users_userid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_userid_seq', 1, true);


--
-- TOC entry 2880 (class 2606 OID 16403)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (productid);


--
-- TOC entry 2882 (class 2606 OID 16405)
-- Name: products products_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_url_key UNIQUE (productcode);


--
-- TOC entry 2884 (class 2606 OID 16426)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (reviewid);


--
-- TOC entry 2886 (class 2606 OID 16451)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (userid);


--
-- TOC entry 2887 (class 2606 OID 16427)
-- Name: reviews fk_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fk_product FOREIGN KEY (productid) REFERENCES public.products(productid);


--
-- TOC entry 3029 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2026-04-11 17:00:47

--
-- PostgreSQL database dump complete
--

\unrestrict xgpF58ReJuji9duvrxN7crCQaVsDAl4DrS1qSldNjAnfdbYHVejCVQKVDd6ScJp

