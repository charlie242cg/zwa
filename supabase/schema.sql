-- Project Zwa: Core Database Schema

-- 1. Profiles Table (Extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'affiliate', 'admin')),
  is_verified_seller BOOLEAN DEFAULT FALSE,
  is_vip_influencer BOOLEAN DEFAULT FALSE,
  wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Products Table
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  min_order_quantity INTEGER DEFAULT 1,
  default_commission DECIMAL(5, 2) DEFAULT 0.00,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Conversations Table
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  source_affiliate_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Messages Table
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Orders Table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(id),
  seller_id UUID REFERENCES public.profiles(id),
  product_id UUID REFERENCES public.products(id),
  affiliate_id UUID REFERENCES public.profiles(id),
  amount DECIMAL(12, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  commission_amount DECIMAL(12, 2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'completed', 'disputed')),
  delivery_otp_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Auth Trigger to Sync Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'buyer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public products are viewable by everyone." ON public.products FOR SELECT USING (true);
CREATE POLICY "Sellers can insert their own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update their own products" ON public.products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete their own products" ON public.products FOR DELETE USING (auth.uid() = seller_id);

CREATE POLICY "Users view messages in their conversations" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
);
CREATE POLICY "Users can send messages to their conversations" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
);

-- 7. Orders Policies
CREATE POLICY "Buyers can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can view orders for their products" ON public.orders FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Affiliates can view referred orders" ON public.orders FOR SELECT USING (auth.uid() = affiliate_id);
CREATE POLICY "Buyers can insert their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update their orders" ON public.orders FOR UPDATE USING (auth.uid() = seller_id);

-- 8. Affiliate Links Table (Management of active promotions)
CREATE TABLE public.affiliate_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(affiliate_id, product_id)
);

ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can manage their own links" ON public.affiliate_links
  FOR ALL USING (auth.uid() = affiliate_id);
