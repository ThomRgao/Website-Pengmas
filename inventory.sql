--
-- PostgreSQL database dump
--

\restrict PZZYOHybNqLg4fO5ScOJxaO3XB5BK4jgcWTrW4iKpSmXth2527hosc31uXgRNlg

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: borrowings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.borrowings (
    id integer NOT NULL,
    borrow_type character varying(50) NOT NULL,
    item_id integer,
    item_name character varying(200),
    borrower_name character varying(150),
    borrower_phone character varying(100),
    borrower_address text,
    quantity integer DEFAULT 1 NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    notes text,
    submitted_at date,
    requested_borrow_date date,
    approved_at date,
    borrow_date date,
    expected_return date,
    return_date date,
    duration_days integer DEFAULT 0 NOT NULL,
    linked_return_id integer,
    return_request_status character varying(50),
    return_requested_at date,
    return_verified_at date,
    return_verified_by character varying(150),
    return_photo text,
    condition_on_return character varying(50),
    return_notes text,
    payment_proof text,
    payment_proof_name character varying(255),
    payment_status character varying(50),
    whatsapp_status character varying(50),
    whatsapp_response jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.borrowings OWNER TO postgres;

--
-- Name: borrowings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.borrowings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.borrowings_id_seq OWNER TO postgres;

--
-- Name: borrowings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.borrowings_id_seq OWNED BY public.borrowings.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(100) NOT NULL,
    category character varying(100),
    stock integer DEFAULT 0 NOT NULL,
    min_stock integer DEFAULT 0 NOT NULL,
    condition character varying(50),
    location character varying(150),
    price bigint DEFAULT 0 NOT NULL,
    image text,
    service_mode character varying(50) DEFAULT 'both'::character varying NOT NULL
);


ALTER TABLE public.items OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_id_seq OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: public_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.public_config (
    id integer NOT NULL,
    rental_qris_link text,
    rental_qris_image text,
    admin_whatsapp_number character varying(50),
    whatsapp_api_url text,
    whatsapp_api_token text,
    whatsapp_message_template text
);


ALTER TABLE public.public_config OWNER TO postgres;

--
-- Name: public_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.public_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.public_config_id_seq OWNER TO postgres;

--
-- Name: public_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.public_config_id_seq OWNED BY public.public_config.id;


--
-- Name: public_returns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.public_returns (
    id integer NOT NULL,
    type character varying(50),
    borrowing_id integer,
    item_id integer,
    item_name character varying(200),
    borrow_type character varying(50),
    returner_name character varying(150),
    returner_phone character varying(100),
    condition_on_return character varying(50),
    return_notes text,
    return_photo text,
    submitted_at date,
    status character varying(50),
    verified_at date,
    verified_by character varying(150),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.public_returns OWNER TO postgres;

--
-- Name: public_returns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.public_returns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.public_returns_id_seq OWNER TO postgres;

--
-- Name: public_returns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.public_returns_id_seq OWNED BY public.public_returns.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    item_id integer,
    item_name character varying(200),
    type character varying(20) NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    date date,
    user_id integer,
    user_name character varying(150),
    notes text,
    total_price bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    full_name character varying(150),
    email character varying(150),
    status character varying(50),
    join_date date
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: borrowings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.borrowings ALTER COLUMN id SET DEFAULT nextval('public.borrowings_id_seq'::regclass);


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: public_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_config ALTER COLUMN id SET DEFAULT nextval('public.public_config_id_seq'::regclass);


--
-- Name: public_returns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_returns ALTER COLUMN id SET DEFAULT nextval('public.public_returns_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: borrowings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.borrowings (id, borrow_type, item_id, item_name, borrower_name, borrower_phone, borrower_address, quantity, status, notes, submitted_at, requested_borrow_date, approved_at, borrow_date, expected_return, return_date, duration_days, linked_return_id, return_request_status, return_requested_at, return_verified_at, return_verified_by, return_photo, condition_on_return, return_notes, payment_proof, payment_proof_name, payment_status, whatsapp_status, whatsapp_response, created_at, updated_at) FROM stdin;
1	peminjaman	3	Kursi Kantor	Andi	0812	Bdo	1	returned	a	2026-04-09	2026-04-09	2026-04-09	2026-04-09	2026-04-17	2026-04-09	8	1	verified	2026-04-09	2026-04-09	Administrator		Baik	ok			\N	\N	\N	2026-04-09 21:48:07.65219	2026-04-09 21:49:05.544855
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (id, name, code, category, stock, min_stock, condition, location, price, image, service_mode) FROM stdin;
1	Laptop Ngawi	LPT-001	Elektronik	5	2	Baik	Gudang A	25000000	https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400	both
2	Proyektor Amba	PRJ-001	Elektronik	3	1	Baik	Gudang B	8500000	https://images.unsplash.com/photo-1519558260268-cde7e03a0152?w=400	both
4	Lemari Razan	FRN-002	Furniture	5	2	Baik	Gudang C	5200000	https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400	borrow
5	Printer	PRT-001	Elektronik	8	3	Baik	Gudang B	4200000	https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400	rent
6	Mouse Logitech	ACC-001	Aksesoris	15	10	Baik	Gudang A	350000	https://images.unsplash.com/photo-1527814050087-3793815479db?w=400	both
3	Kursi Kantor	FRN-001	Furniture	20	5	Baik	Gudang A	3500000	https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400	borrow
\.


--
-- Data for Name: public_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.public_config (id, rental_qris_link, rental_qris_image, admin_whatsapp_number, whatsapp_api_url, whatsapp_api_token, whatsapp_message_template) FROM stdin;
1	https://example.com/qris					Halo Admin, ada pengajuan penyewaan baru atas nama {{name}} untuk barang {{itemName}} sejumlah {{quantity}} unit. Bukti pembayaran sudah diupload.
\.


--
-- Data for Name: public_returns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.public_returns (id, type, borrowing_id, item_id, item_name, borrow_type, returner_name, returner_phone, condition_on_return, return_notes, return_photo, submitted_at, status, verified_at, verified_by, created_at, updated_at) FROM stdin;
1	return-request	1	3	Kursi Kantor	peminjaman	Andi	0812	Baik	ok		2026-04-09	verified	2026-04-09	Administrator	2026-04-09 21:48:57.889628	2026-04-09 21:49:05.544855
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, item_id, item_name, type, quantity, date, user_id, user_name, notes, total_price) FROM stdin;
1	1	Laptop Ngawi	in	5	2025-10-01	1	Administrator	Pembelian baru dari supplier	125000000
2	3	Kursi Kantor	out	1	2026-04-09	1	Administrator	Peminjaman disetujui	0
3	3	Kursi Kantor	in	1	2026-04-09	1	Administrator	Pengembalian peminjaman diverifikasi admin	0
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, role, full_name, email, status, join_date) FROM stdin;
1	admin	admin	admin	Administrator	admin@inventory.com	active	2024-01-15
\.


--
-- Name: borrowings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.borrowings_id_seq', 1, true);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.items_id_seq', 6, true);


--
-- Name: public_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.public_config_id_seq', 1, false);


--
-- Name: public_returns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.public_returns_id_seq', 1, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: borrowings borrowings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.borrowings
    ADD CONSTRAINT borrowings_pkey PRIMARY KEY (id);


--
-- Name: items items_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_code_key UNIQUE (code);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: public_config public_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_config
    ADD CONSTRAINT public_config_pkey PRIMARY KEY (id);


--
-- Name: public_returns public_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_returns
    ADD CONSTRAINT public_returns_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: borrowings borrowings_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.borrowings
    ADD CONSTRAINT borrowings_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE RESTRICT;


--
-- Name: public_returns public_returns_borrowing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_returns
    ADD CONSTRAINT public_returns_borrowing_id_fkey FOREIGN KEY (borrowing_id) REFERENCES public.borrowings(id) ON DELETE CASCADE;


--
-- Name: public_returns public_returns_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_returns
    ADD CONSTRAINT public_returns_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE RESTRICT;


--
-- Name: transactions transactions_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict PZZYOHybNqLg4fO5ScOJxaO3XB5BK4jgcWTrW4iKpSmXth2527hosc31uXgRNlg

